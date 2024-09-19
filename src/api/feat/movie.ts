import http from '@/api/index'
import { ApiPaginationResponse, ApiResponse, Movie } from '@/type/api'
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