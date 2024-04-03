import Link from 'next/link'
import Movie from '../app/movie/page'
import Theater from '../app/theater/page'

export const menu = [
  {
    router: '/theater',
    name: <Link href="/theater">劇場リスト</Link>,
    component: Theater
  },
  {
    router: '/movie',
    name: <Link href="/movie">映画リスト</Link>,
    component: Movie
  }
]