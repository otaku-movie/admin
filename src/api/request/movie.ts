import http from '@/api/index'
import {
  ApiPaginationResponse,
  ApiResponse,
  Movie,
  MovieDuplicateGroup,
  MovieDuplicateItem,
  MovieMergeDetail,
  MovieMergeResult,
  MoviePendingMatch,
  MovieVersion
} from '@/type/api'
import {
  GetDetailQuery,
  MovieDuplicateQuery,
  MovieListQuery,
  MovieMergeBody,
  MovieMergeDetailQuery,
  MovieMergeSearchQuery,
  MoviePendingMatchResolveBody
} from '@/type/query/movie'

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
    params: query
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

/**
 * 自动模式：分页获取重复电影候选组（同 tmdb_id / 同名字）
 */
export function getMovieDuplicates (query: MovieDuplicateQuery) {
  return http<ApiPaginationResponse<MovieDuplicateGroup[]>>({
    url: 'admin/movie/duplicates',
    method: 'post',
    data: query
  })
}

/**
 * 手动模式：按关键词搜索可合并电影（名字 / movie_key / id / tmdb_id）
 */
export function searchMoviesForMerge (query: MovieMergeSearchQuery) {
  return http<ApiResponse<MovieDuplicateItem[]>>({
    url: 'admin/movie/mergeSearch',
    method: 'post',
    data: query
  })
}

/**
 * 合并详情对比：批量按 id 拉取候选电影完整信息（合并前并排核对）
 */
export function getMovieMergeDetail (body: MovieMergeDetailQuery) {
  return http<ApiResponse<MovieMergeDetail[]>>({
    url: 'admin/movie/mergeDetail',
    method: 'post',
    data: body
  })
}

/**
 * 执行合并：loser 重指向 survivor 后软删，survivor 复活并可选改名
 */
export function mergeMovies (body: MovieMergeBody) {
  return http<ApiResponse<MovieMergeResult>>({
    url: 'admin/movie/merge',
    method: 'post',
    data: body
  })
}

/**
 * 待确认模式：crawler 写入的 85%~95% 灰区模糊匹配
 */
export function getMoviePendingMatches (query: MovieDuplicateQuery) {
  return http<ApiPaginationResponse<MoviePendingMatch[]>>({
    url: 'admin/movie/pendingMatches',
    method: 'post',
    data: query
  })
}

/**
 * 处理待确认项：合并或忽略
 */
export function resolveMoviePendingMatch (body: MoviePendingMatchResolveBody) {
  return http<ApiResponse<MovieMergeResult>>({
    url: 'admin/movie/pendingMatch/resolve',
    method: 'post',
    data: body
  })
}
