import http from '@/api/index'
import { ApiPaginationResponse, ApiResponse, Movie } from '@/type/api'
import { GetDetailQuery, MovieListQuery } from '@/type/query/movie'

export interface MovieShowTimeItem {
  id: number
  movieId: number
  movieName: string
  movieCover: string
  open: boolean
  seatCount: number
  selectedSeatCount: number
  cinemaId: number
  cinemaName: string
  startTime: string
  endTime: string
  // 放映状态
  status: 1 | 2 | 3
}

export interface CinemaScreeing {
  id: number
  name: string
  date: string
  children: MovieShowTimeItem[]
}
export interface GetCinemaScreeningQuery {
  id: string
  date: string
}

export function getCinemaScreeningList (query: GetCinemaScreeningQuery) {
  return http<ApiResponse<CinemaScreeing[]>>({
    url: 'cinema/screening',
    method: 'get',
    params: query
  })
}