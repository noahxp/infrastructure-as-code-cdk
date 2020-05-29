# Welcome the CDK TypeScript project.

- aws-cdk reference: [github/aws/aws-cdk](https://github.com/aws/aws-cdk)
- For imported resources,use the level 2 construct library : [@aws-cdk](https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk)

## The popular example

- [AWS SA pahud](https://github.com/pahud/cdk-samples/tree/master/typescript/packages)
- [pahud's tips](https://github.com/pahud/cdk-samples/tree/master/common-tips)
- [AWS SDK Example](https://github.com/aws-samples/aws-cdk-examples)

## Deployments Example Project

- deploy stack

```bash
# deploy ACM on us-east-1
$ cdk deploy -c stack=acm
# deploy CDN WAF on us-east-1
$ cdk deploy -c stack=cdnwaf

# deploy ACM on ap-northeast-1 for alb
$ export CDK_ACM_SUBDOMAIN=alb. && cdk deploy -c stack=albacm
```

- before deploy example stack, update the Arn in cdk.json

```json
  "ALBACMArn": "arn:aws:acm:ap-northeast-1:796957138374:certificate/755453b2-b552-4ac5-b80b-c6360f37e537",
  "CDNACMArn": "arn:aws:acm:us-east-1:796957138374:certificate/cbaeed36-8a60-4291-ac76-176c8c80a767",
  "CDNWafArn": "arn:aws:wafv2:us-east-1:796957138374:global/webacl/CDNWAF-oPjY1pWbGlPC/a8186c28-f5c4-4984-9522-da91b9b0facf",
```

- upload the static file to s3

```bash
$ cd resources/s3
$ aws s3 cp . s3://xxxxxxxxxxxxxxx --recursive
```

- push docker image to ECR (the codepiple with auto push on first time)

```bash
$ cd resources/docker
# login to ECR & push docker image to ECR
$ aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin XXXXXXXXXX.dkr.ecr.ap-northeast-1.amazonaws.com
$ docker build -t XXXXXXXXXXXXX .
$ docker tag XXXXXXXXXXXXX:latest XXXXXXXXXXXXX.dkr.ecr.ap-northeast-1.amazonaws.com/XXXXXXXXXXXXX:latest
$ docker push XXXXXXXXXXXXX.dkr.ecr.ap-northeast-1.amazonaws.com/XXXXXXXXXXXXX:latest
```

- clean up

```bash
$ ./resources/clear.sh

$ cdk destroy
$ cdk destroy -c stack=cdnwaf
$ cdk destroy -c stack=acm
```

## Setup environment

- install or upgrade cdk

```bash
npm install -g aws-cdk
```

- update node package

```bash
npm update
```

- install construct library (example)

```bash
npm i @aws-cdk/aws-ec2
  ```

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
