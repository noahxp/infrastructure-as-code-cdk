
export interface Resources {
  VpcCidr: string,
  NatGateways: number,
  LogLifecycle: number,
  DomainName: string,
  HostDomainName: string,
  ACMArn: string,
  FargateCPU: number,
  FargateMemory: number,
  TaskMaxCapacity: number,
  TaskMinCapacity: number,
  TaskScheduleStart: number,
  TaskScheduleEnd: number,
}