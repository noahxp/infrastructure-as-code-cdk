#!/bin/bash
aws s3 ls |awk '{print $3}' |grep cdk-example|xargs -L 1 -I {} aws s3 rm s3://{} --recursive
aws ecr describe-repositories|grep Name|grep "cdk-e"|awk -F\" '{print $4}'|xargs -L 1 -I {} aws ecr delete-repository --repository-name {} --force
aws logs describe-log-groups|grep logGroupName|grep -e cdk-example -e Pipeline|awk -F\"  '{print $4}'|xargs -L 1 -I {} aws logs delete-log-group --log-group-name {}

aws codebuild list-builds|grep Pipeline|awk -F\" '{print $2}' |xargs -L 1 -I {} aws codebuild batch-delete-builds --id {}

aws s3 ls |grep "pipelineartifact"|awk '{print $3}'|xargs -L 1 -I {} aws s3 rb s3://{}

echo === clear done ===
