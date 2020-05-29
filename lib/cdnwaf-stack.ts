import * as cdk from '@aws-cdk/core'
import * as wafv2 from '@aws-cdk/aws-wafv2'
import {Resources} from './interface'
import { CfnOutput } from '@aws-cdk/core';

export class CDNWafStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const runtimeEnvironment: string = 'dev'
    const resources: Resources = this.node.tryGetContext(runtimeEnvironment)
    const hostDomainName: string = resources.HostDomainName


    const cdnWAF = new wafv2.CfnWebACL(this, 'CDNWAF' ,{
      scope: 'CLOUDFRONT',
      defaultAction: {allow: {}},
      rules: [
        // TODO: custome policy ,
        // {
        //   priority: 1,
        //   overrideAction: { none: {} },
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: "WAF-Header"
        //   },
        //   name: "WAF-Header",
        //   statement: {
        //     notStatement: {
        //       statement: {
        //         byteMatchStatement: {
        //           fieldToMatch: {
        //             singleHeader: {
        //               'Name': 'XHeader'
        //             }
        //           },
        //           positionalConstraint: "CONTAINS",
        //           searchString: "StringToMatch",
        //           textTransformations: [
        //             {
        //               priority: 0,
        //               type: 'NONE',
        //             }
        //           ]
        //         },
        //       },
        //     }
        //   }
        // },
        {
          priority: 100,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWS-AWSManagedRulesPHPRuleSet"
          },
          name: "AWS-AWSManagedRulesPHPRuleSet",
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesPHPRuleSet"
            }
          }
        },
      ],
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'cdnWAF',
        sampledRequestsEnabled: true,
      }
    })


    new CfnOutput(this, 'WafARN', {
      exportName: hostDomainName.replace (/\./gi,'') + 'CdnwafARN',
      value: cdnWAF.attrArn
    })
  }
}