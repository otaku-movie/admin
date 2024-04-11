import { AxiosInterceptorOptions } from 'axios'

declare module 'axios' {
  export interface AxiosInterceptorManager<V> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use(
      onFulfilled?: ((value: AxiosResponse<V>) => V | Promise<V>) | null,
      onRejected?: ((error: any) => any) | null,
      options?: AxiosInterceptorOptions
    ): number
  }
}