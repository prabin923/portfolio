#!/usr/bin/env bash
# Rebuild the portfolio server in a fresh AWS Academy (voclabs) lab session.
#
# The AWS Academy sandbox deletes every resource when a session ends, so run
# this once per session from AWS CloudShell (AWS console > CloudShell icon):
#
#   curl -fsSL https://raw.githubusercontent.com/prabin923/portfolio/main/scripts/aws-academy-rebuild.sh | bash
#
# It creates the "portfolio-web" security group (SSH 22 + HTTP 80), launches an
# Amazon Linux 2023 instance that installs Node 22, swap, PM2 and Nginx, clones
# and builds this repo, and authorizes the GitHub Actions deploy key.
#
# Afterwards: update the EC2_HOST secret (GitHub > Settings > Environments >
# Production) to the PUBLIC_IP printed at the end. If the script says it made a
# NEW deploy key, also replace EC2_SSH_KEY with the output of: cat ~/github_deploy
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$REGION"
NAME_TAG="aws_deploy"
SG_NAME="portfolio-web"
WORKDIR="$(mktemp -d)"

# 1. Deploy key for GitHub Actions (reused if CloudShell still has it)
NEW_KEY=no
if [ ! -f ~/github_deploy ]; then
  ssh-keygen -q -t ed25519 -N '' -C github-actions-deploy -f ~/github_deploy
  NEW_KEY=yes
fi
PUB="$(cat ~/github_deploy.pub)"

# 2. User data that runs on the new instance at first boot
cat > "$WORKDIR/userdata.sh" <<'USERDATA'
#!/bin/bash
exec > /var/log/portfolio-setup.log 2>&1
set -x

# 2 GB swap so `next build` fits on a ~1 GB instance
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

dnf install -y git nodejs22 nodejs22-npm nginx
alternatives --set node /usr/bin/node-22 || true
npm install -g pm2
PM2="$(command -v pm2)"

# GitHub Actions deploy key (public half only)
install -d -m 700 -o ec2-user -g ec2-user /home/ec2-user/.ssh
echo '__PUBKEY__' >> /home/ec2-user/.ssh/authorized_keys
chown ec2-user:ec2-user /home/ec2-user/.ssh/authorized_keys
chmod 600 /home/ec2-user/.ssh/authorized_keys

# Nginx: port 80 -> Next.js on 3000
sed -i 's/ default_server//g' /etc/nginx/nginx.conf
cat > /etc/nginx/conf.d/portfolio.conf <<'NGINX'
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX
systemctl enable --now nginx

# Clone, build and start the site as ec2-user
sudo -u ec2-user -H bash -c "cd ~ && git clone https://github.com/prabin923/portfolio.git && cd portfolio && npm ci && npm run build && $PM2 start npm --name portfolio -- start && $PM2 save"
env PATH="$PATH:/usr/bin" "$PM2" startup systemd -u ec2-user --hp /home/ec2-user

echo SETUP_DONE
USERDATA
sed -i "s|__PUBKEY__|$PUB|" "$WORKDIR/userdata.sh"

# 3. Security group: SSH (GitHub Actions) + HTTP (visitors)
SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" \
      --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)
if [ -z "$SG" ] || [ "$SG" = "None" ]; then
  SG=$(aws ec2 create-security-group --group-name "$SG_NAME" \
        --description "Portfolio web: SSH + HTTP" --query GroupId --output text)
  aws ec2 authorize-security-group-ingress --group-id "$SG" --ip-permissions \
    'IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=0.0.0.0/0}]' \
    'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' > /dev/null
fi
echo "Security group: $SG"

# 4. Latest Amazon Linux 2023 AMI
AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
       --query Parameter.Value --output text 2>/dev/null || \
      aws ec2 describe-images --owners amazon \
       --filters 'Name=name,Values=al2023-ami-2023*-kernel-*-x86_64' \
       --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text)
echo "AMI: $AMI"

# 5. Launch the instance (t3.micro, falling back to t2.micro)
IID=""
for TYPE in t3.micro t2.micro; do
  if IID=$(aws ec2 run-instances --image-id "$AMI" --instance-type "$TYPE" \
            --security-group-ids "$SG" --user-data "file://$WORKDIR/userdata.sh" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME_TAG}]" \
            --query 'Instances[0].InstanceId' --output text 2>"$WORKDIR/run.err"); then
    break
  fi
  echo "run-instances with $TYPE failed: $(tail -1 "$WORKDIR/run.err")"
  IID=""
done
[ -n "$IID" ] || { echo "Could not launch an instance."; exit 1; }
echo "Instance: $IID"

aws ec2 wait instance-running --instance-ids "$IID"
IP=$(aws ec2 describe-instances --instance-ids "$IID" \
      --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# 6. Wait for the site to come up (first boot build takes ~5 minutes)
echo "Waiting for http://$IP/ ..."
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://$IP/" || true)
  [ "$code" = "200" ] && break
  sleep 10
done

echo
echo "PUBLIC_IP=$IP   (site: http://$IP/  HTTP $code)"
echo "Next: set EC2_HOST=$IP in GitHub > Settings > Environments > Production."
if [ "$NEW_KEY" = yes ]; then
  echo "A NEW deploy key was created: also replace EC2_SSH_KEY with the output of: cat ~/github_deploy"
fi
rm -rf "$WORKDIR"
