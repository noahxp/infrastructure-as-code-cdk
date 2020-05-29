#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExampleStack } from '../lib/example-stack';
import { ACMStack } from '../lib/acm-stack';


const app = new cdk.App();

const stackName: string = app.node.tryGetContext("stack")?app.node.tryGetContext("stack"):'example'
let env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT
}
let acmEnv = {
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT
}
let stacks = {
  'example': {'cdk': ExampleStack, 'cdkName': 'cdk-example'},
  'acm': {'cdk': ACMStack, 'cdkName': 'acm-stack'},
}


if (stackName === 'acm'){
  env = acmEnv
}

// new ExampleStack(app, stackName, {env: env});
new (<any>stacks)[stackName].cdk(app, (<any>stacks)[stackName].cdkName, { env })

/*
cli :
$cdk synth -c stack=example  or $cdk synth (default stack)
$cdk synth -c stack=acm
*/