import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as s3 from '@aws-cdk/aws-s3'
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2'
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as dns from '@aws-cdk/aws-route53'
import * as dnsTarget from '@aws-cdk/aws-route53-targets'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ecs from '@aws-cdk/aws-ecs'
import * as wafv2 from '@aws-cdk/aws-wafv2'
import { Resources } from './interface'

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const runtimeEnvironment: string = 'dev'
    const resources: Resources = this.node.tryGetContext(runtimeEnvironment)

    const vpcCidr: string = resources.VpcCidr
    const natGateways: number = resources.NatGateways
    const logLifecycle: number = resources.LogLifecycle
    const domainName: string = resources.DomainName
    const hostDomainName: string = resources.HostDomainName
    const acmArn: string = resources.ACMArn
    const fargateCPU: number = resources.FargateCPU
    const fargateMemory: number = resources.FargateMemory
    const taskMaxCapacity: number = resources.TaskMaxCapacity
    const taskMinCapacity: number = resources.TaskMinCapacity
    const taskScheduleStart: number = resources.TaskScheduleStart
    const taskScheduleEnd: number = resources.TaskScheduleEnd

    const isTaskScheduleByTime: boolean = false


    /***** networking *****/
    const vpcFlowLogBucket = new s3.Bucket(this, 'VpcFlowLogBucket', {
      lifecycleRules: [{
        expiration: cdk.Duration.days(logLifecycle),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const albLogBucket = new s3.Bucket(this, 'AlbLogBucket', {
      lifecycleRules: [{
        expiration: cdk.Duration.days(logLifecycle),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const cdnLogBucket = new s3.Bucket(this, 'CdnLogBucket', {
      lifecycleRules: [{
        expiration: cdk.Duration.days(logLifecycle),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: vpcCidr,
      flowLogs: {
        vpcFlowLogs: {
          destination: ec2.FlowLogDestination.toS3(vpcFlowLogBucket),
          trafficType: ec2.FlowLogTrafficType.ALL
        }
      },
      maxAzs: 3,
      natGateways: natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'nat',
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 24,
          name: 'private1',
          subnetType: ec2.SubnetType.ISOLATED,
        },
        {
          cidrMask: 28,
          name: 'private2',
          subnetType: ec2.SubnetType.ISOLATED,
        }

      ],
    })

    const hostedZone = dns.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,  // noah.tw
      privateZone: false,
    });



    /****** vpc - endpoint/private-link ****/
    const dynamodbEndPoint = vpc.addGatewayEndpoint('DynamodbGatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        { subnets: vpc.isolatedSubnets }
      ]
    })
    dynamodbEndPoint.addToPolicy(
      new iam.PolicyStatement({
        principals: [new iam.AnyPrincipal()],
        actions: ['dynamodb:*'],
        resources: ['*'],
      })
    )
    vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnets: vpc.isolatedSubnets }
      ]
    })
    vpc.addInterfaceEndpoint('ECRPrivateLink', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      privateDnsEnabled: true,
      subnets: {
        subnetGroupName: 'private1'
        // subnets: vpc.isolatedSubnets  // There are multiple vpc.isolatedSubnets, so we need to specify the subnet in another way.
      },
    })
    vpc.addInterfaceEndpoint('LogsPrivateLink', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
      subnets: {
        subnetGroupName: 'private1'
      },
    })



    // const host = new ec2.BastionHostLinux(this, 'BastionHost', { vpc });


    /**** application resources */

    // frontend , the static resources
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      }
    })



    // acm for ALB
    const albACM = new acm.Certificate(this, 'ALBAcm', {
      domainName: '*.' + hostDomainName,   // // aws.noah.tw
      validationMethod: acm.ValidationMethod.DNS,
    });
    // DnsValidatedCertificate will automatic create a acm (ex: aws.noah.tw)
    const certificate = new acm.DnsValidatedCertificate(this, 'ValidationCertificate', {
      domainName: 'alb.' + hostDomainName,   // aws.noah.tw
      hostedZone,
    });
    // Application Load balancer
    const ALBSg = new ec2.SecurityGroup(this, 'ALBSg', { vpc: vpc })
    ALBSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow from anywhere')
    ALBSg.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), 'allow from anywhere')
    const ALB = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      deletionProtection: false,
      internetFacing: true,
      securityGroup: ALBSg,
      vpcSubnets: {
        subnets: vpc.publicSubnets,
      },
    })
    ALB.logAccessLogs(albLogBucket, 'ALBAccessLogs')
    const ALBTg1 = createTargetGroup(this, 'ALBTg1')
    const ALBTg2 = createTargetGroup(this, 'ALBTg2')
    const ALBListener = ALB.addListener('ALBListener', {
      protocol: elbv2.ApplicationProtocol.HTTPS,
      port: 443,
      certificates: [albACM],
      defaultTargetGroups: [
        ALBTg1
      ],
    })
    // const ALBListenerRule = new elbv2.ApplicationListenerRule(this, 'ALBListenerRule', {
    //   listener: ALBListener,
    //   priority: 1,
    //   hostHeader: 'abc',
    //   fixedResponse: {
    //     statusCode: '202',
    //   }
    // })
    const albARecord = new dns.ARecord(this, 'ALBARecord', {
      zone: hostedZone,
      target: dns.RecordTarget.fromAlias(new dnsTarget.LoadBalancerTarget(ALB)),
      recordName: 'alb.' + hostDomainName  //aws.noah.tw
    })



    // WAF
    const albWAF = new wafv2.CfnWebACL(this, 'ALBWAF' ,{
      scope: 'REGIONAL',
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
        metricName: 'albWAF',
        sampledRequestsEnabled: true,
      }
    })
    new wafv2.CfnWebACLAssociation(this, 'ALBWAFAssociation', {
      resourceArn: ALB.loadBalancerArn,
      webAclArn: albWAF.attrArn
    })



    // CDN
    const globalCert = acm.Certificate.fromCertificateArn(this, 'GlobalCert', acmArn)
    const cdnOAI = new cloudfront.OriginAccessIdentity(this, 'CDNOAI', {
      comment: 'access-identity-' + frontendBucket.bucketName
    })
    const cdn = new cloudfront.CloudFrontWebDistribution(this, 'CDN', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: frontendBucket,
            originAccessIdentity: cdnOAI
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              pathPattern: '/',
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              forwardedValues: { queryString: true },
              defaultTtl: cdk.Duration.minutes(0),
              maxTtl: cdk.Duration.minutes(0),
              minTtl: cdk.Duration.minutes(0),
            }
          ],
        },{
          customOriginSource: {
            // domainName: ALB.loadBalancerDnsName,
            domainName: albARecord.domainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originKeepaliveTimeout: cdk.Duration.seconds(5),
            originReadTimeout: cdk.Duration.seconds(30),
          },
          behaviors: [
            {
              // TODO
              // 1. Cache Based on Selected Request Headers
              // 2. redirect apis 404 not found.
              // 3. customer header
              pathPattern: '/apis/*',
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              defaultTtl: cdk.Duration.minutes(0),
              maxTtl: cdk.Duration.minutes(0),
              minTtl: cdk.Duration.minutes(0),
              forwardedValues: {
                queryString: true,
                cookies: {
                  forward: "all"
                 },
                // headers:
              },
            }
          ]
        }
      ],
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        globalCert,
        {
          aliases: [hostDomainName],
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
          sslMethod: cloudfront.SSLMethod.SNI, // default
        },
      ),
      loggingConfig: {
        bucket: cdnLogBucket,
        includeCookies: true,
        prefix: "CDNLogs"
      },
      comment: "cdn for " + hostDomainName,
    })
    const cdnARecord = new dns.ARecord(this, 'cdnARecord', {
      zone: hostedZone,
      target: dns.RecordTarget.fromAlias(new dnsTarget.CloudFrontTarget(cdn)),
      recordName: hostDomainName  //aws.noah.tw
    })



    // ECR、ECS
    const backendECR = new ecr.Repository(this, 'BackendECR', {
      lifecycleRules: [{ maxImageCount: 500 }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const ecsCluster = new ecs.Cluster(this, "EcsCluster", {
      vpc: vpc
    })

    const backendTaskDef = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      cpu: fargateCPU,
      memoryLimitMiB: fargateMemory,
    })
    const backendContainer = backendTaskDef.addContainer("BackendContainer", {
      image: ecs.ContainerImage.fromEcrRepository(backendECR, 'latest'),
      environment: {
        'ENV': runtimeEnvironment,
        // 'spring.profiles.active': runtimeEnvironment,
      },
      startTimeout: cdk.Duration.minutes(5),
      stopTimeout: cdk.Duration.minutes(2),
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'ecs-billing-backend' })
    })
    backendContainer.addPortMappings({
      containerPort: 8080,
    })
    // ECS - Service
    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster: ecsCluster,
      taskDefinition: backendTaskDef,
      desiredCount: 0,
      assignPublicIp: false,
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      vpcSubnets: {
        // subnets: vpc.isolatedSubnets,  // have 6 subnets in this case.
        subnetGroupName: 'private1'
      }
    })
    backendService.attachToApplicationTargetGroup(ALBTg1)
    const backendTaskScaling = backendService.autoScaleTaskCount({
      maxCapacity: taskMaxCapacity,
      minCapacity: taskMinCapacity,
    })
    // ecs task scaling by cpu utilization
    backendTaskScaling.scaleOnCpuUtilization('CpuUtilization', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.minutes(15),
      scaleOutCooldown: cdk.Duration.minutes(5),
    })
    // ecs task scaling by time schedule , https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
    if (isTaskScheduleByTime) {
      backendTaskScaling.scaleOnSchedule('PrescaleInTheMorning', {
        schedule: autoscaling.Schedule.expression("cron(0 " + taskScheduleStart + " * * ? *)"),
        minCapacity: taskMinCapacity,
      })
      backendTaskScaling.scaleOnSchedule('AllowDownscalingAtNight', {
        schedule: autoscaling.Schedule.expression("cron(0 " + taskScheduleEnd + " * * ? *)"),
        minCapacity: taskMinCapacity
      })
    }







    /***** The share function *****/
    function createTargetGroup(_super: cdk.Stack, id: string) {
      return new elbv2.ApplicationTargetGroup(_super, id, {
        vpc: vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200-499',
          healthyThresholdCount: 3,
          unhealthyThresholdCount: 3,
          interval: cdk.Duration.seconds(10),
          path: '/monitor/health',
          protocol: elbv2.Protocol.HTTP,
          port: '8080',
          timeout: cdk.Duration.seconds(5),
        },
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        deregistrationDelay: cdk.Duration.seconds(30)
      })
    }
  }
}
