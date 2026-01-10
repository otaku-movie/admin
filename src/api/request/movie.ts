import http from '@/api/index'
import { ApiPaginationResponse, ApiResponse, Movie, MovieVersion } from '@/type/api'
import { GetDetailQuery, MovieListQuery } from '@/type/query/movie'

export function getMovieList (query: MovieListQuery) {
  return http<ApiPaginationResponse<Movie[]>>({
    url: 'movie/list',
    method: 'post',
    data: query
  })
}

export function getMovieDetail (query: GetDetailQuery) {
  return http<ApiResponse<Movie[]>>({
    url: 'movie/detail',
    method: 'get',
    data: query
  })
}

/**
 * 获取电影版本列表
 */
export function getMovieVersions (movieId: number) {
  return http<ApiResponse<MovieVersion[]>>({
    url: 'movie/version/list',
    method: 'get',
    params: { movieId }
  })
}
