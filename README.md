# Welcome the CDK TypeScript project.

- aws-cdk reference: [github/aws/aws-cdk](https://github.com/aws/aws-cdk)
- For imported resources,use the level 2 construct library : [@aws-cdk](https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk)

## The popular example

- [AWS SA pahud](https://github.com/pahud/cdk-samples/tree/master/typescript/packages)
- [pahud's tips](https://github.com/pahud/cdk-samples/tree/master/common-tips)
- [AWS SDK Example](https://github.com/aws-samples/aws-cdk-examples)

## Deployments Example Project

- deploy acm stack

```bash
cdk deploy -c stack=acm
```

- update the ACM Arn to cdk.json

```json
  "ACMArn": "arn:aws:acm:us-east-1:XXXXXXXXXX:certificate/791c80de-7937-4b60-a21b-792129b0e4dc",
```

- deploy example stack

```bash
cdk deploy
# or
cdk deploy -c stack=example
```

- upload the static file to s3

```bash
$ cd resources/s3
$ aws s3 cp * s3://xxxxxxxxxxxxxxx
```

- push docker image to ECR

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
# get s3 bucket & delete it
$ aws s3 ls
$ aws s3 rb s3://cdk-example-frontendXXXXXXXXXXXX --force
$ aws s3 rb s3://cdk-example-logginXXXXXXXXXXXX --force

# get ecr repository name & delete it
$ aws ecr describe-repositories
$ aws ecr delete-repository --repository-name XXXXXXXXXXXX --force

$ cdk destroy
$ cdk destroy -c stack=acm
```

## Setup environment

- install or upgrade cdk

```bash
npm install -g aws-cdk
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
