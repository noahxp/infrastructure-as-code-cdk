#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExampleStack } from '../lib/example-stack';
import { ACMStack } from '../lib/acm-stack';
import { CDNWafStack } from '../lib/cdnwaf-stack';


const app = new cdk.App();

const buildStack: string = app.node.tryGetContext("stack")?app.node.tryGetContext("stack"):'example'

let env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT
}
let virginiaEnv = {
  region: process.env.CDK_DEFAULT_REGION?process.env.CDK_DEFAULT_REGION:'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT
}
let stacks = {
  'example': {'cdk': ExampleStack, 'cfnStackName': 'cdk-example'},
  'acm': {'cdk': ACMStack, 'cfnStackName': 'acm-stack'},
  'cdnwaf': {'cdk': CDNWafStack, 'cfnStackName': 'cdnwaf-stack'},
}


// if (buildStack === 'acm' || buildStack === 'cdnwaf'){
if (buildStack === 'acm' || buildStack === 'cdnwaf'){
  env = virginiaEnv
}

// new ExampleStack(app, stackName, {env: env});
const stack = new (<any>stacks)[buildStack].cdk(app, (<any>stacks)[buildStack].cfnStackName, { env })
if (buildStack === 'example'){
  // stack.templateOptions.transforms = ['AWS::CodeDeployBlueGreen']
}


/*
cli :
$cdk synth -c stack=example  or $cdk synth (default stack)
$cdk synth -c stack=acm
*/