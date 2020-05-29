import * as cdk from '@aws-cdk/core'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as dns from '@aws-cdk/aws-route53'
import {Resources} from './interface'
import { CfnOutput } from '@aws-cdk/core';

export class ACMStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const runtimeEnvironment: string = 'dev'
    const resources: Resources = this.node.tryGetContext(runtimeEnvironment)
    const domainName: string = resources.DomainName
    const hostDomainName: string = resources.HostDomainName

    const domainPrefix: string = process.env.CDK_ACM_SUBDOMAIN?process.env.CDK_ACM_SUBDOMAIN:'';

    // const sslcert = new acm.Certificate(this, 'Sslcert', {
    //   domainName: '*.' + hostDomainName,
    //   // subjectAlternativeNames: ['*.' + domainName],
    //   validationMethod: acm.ValidationMethod.DNS,
    // });

    const hostedZone = dns.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,  //noah.tw
      privateZone: false,
    });

    // DnsValidatedCertificate will automatic create a acm (ex: aws.noah.tw)
    const certificate = new acm.DnsValidatedCertificate(this, 'ValidationCertificate', {
      domainName: domainPrefix + hostDomainName,  //aws.noah.tw
      hostedZone,
    });


    new CfnOutput(this, 'ACM', {
      exportName: 'acm-' + domainPrefix.replace (/\./gi,'') + hostDomainName.replace (/\./gi,''),
      // value: sslcert.certificateArn
      value: certificate.certificateArn
    })

  }
}