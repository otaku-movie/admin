import { create } from 'zustand'
import { Movie } from '@/type/api'

export type SaveMovieQuery = Partial<
Omit<Movie, 'spec' | 'tags'> & {
  spec: number[]
  tags: number[]
  startDate: null | string
  endDate: null | string
  dubbingStartDate?: string | null
  dubbingEndDate?: string | null
}>

export interface MovieStore {
  movie: SaveMovieQuery

  setMovie: (data: SaveMovieQuery) => void
}
export const useMovieStore = create<MovieStore>((set) => {
  return {
    movie: {
      cover: '',
      spec: [],
      startDate: null,
      endDate: null
    },
    setMovie(data: SaveMovieQuery) {
      set({
        movie: data
      })
    }
  }
})