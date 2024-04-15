'use client'
import { redirect } from 'next/navigation'
// import { usePathname, useRouter } from 'next/navigation'
import { PageProps } from './layout'

const App = ({ params: { lng } }: PageProps) => {
  console.log(lng)
  redirect(`/${lng}/movie`)
}

export default App
