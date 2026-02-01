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
  PAY_STATE = 'payState'
}


export enum DubbingVersionEnum {
  ORIGINAL = 1, // 原版
  DUBBING = 2 // 配音版
}
