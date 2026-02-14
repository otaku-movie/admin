/**
 * 字典代码枚举
 * Dictionary code enum
 */
export enum DictCode {
  /** 配音版本 */
  DUBBING_VERSION = 'dubbingVersion',
  /** 2D/3D规格(上映规格) */
  DIMENSION_TYPE = 'dimensionType',
  /** 语言 */
  LANGUAGE = 'language',
  /** 你好电影 */
  HELLO_MOVIE = 'helloMovie',
  /** 上映状态 */
  RELEASE_STATUS = 'releaseStatus',
  /** 订单状态 */
  ORDER_STATE = 'orderState',
  /** 支付状态 */
  PAY_STATE = 'payState',
  /** 场次定价模式 */
  PRICING_MODE = 'pricingMode',
  /** 规则类型优先级（活动下 6 类规则：月度/周度/固定日/时段/固定票价/票种，code 1-6） */
  RULE_TYPE_PRIORITY = 'ruleTypePriority',
  /** 票种生效周期类型：1=周 2=月 3=每日 4=特定日期 */
  TICKET_TYPE_SCHEDULE_TYPE = 'ticketTypeScheduleType'
}


export enum DubbingVersionEnum {
  ORIGINAL = 1, // 原版
  DUBBING = 2 // 配音版
}
