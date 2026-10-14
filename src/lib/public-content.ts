export type PublicImage = {
  id: string
  storage_path: string
  alt_text: string
  caption: string | null
  width: number | null
  height: number | null
  is_cover: boolean
  sort_order: number
}

export type CollectionItem = {
  id: string
  slug: string
  title: string
  description: string
  materials: string | null
  dimensions: string | null
  condition_description: string | null
  availability: 'disponibile' | 'riservato' | 'non_disponibile'
  is_featured: boolean
  featured_order: number | null
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  published_at: string
  images: PublicImage[]
}

export type PortfolioImage = PublicImage & {
  image_kind: 'prima' | 'durante' | 'dopo'
}

export type PortfolioProject = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  category: string
  is_featured: boolean
  featured_order: number | null
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  published_at: string
  images: PortfolioImage[]
}

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const publishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY

function assertConfiguration() {
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Configura PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_PUBLISHABLE_KEY per compilare il sito.')
  }
}

async function readPublicTable<T>(table: string, params: Record<string, string>) {
  assertConfiguration()
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`
    }
  })
  if (!response.ok) {
    throw new Error(`Lettura pubblica ${table} non riuscita (${response.status}).`)
  }
  return response.json() as Promise<T[]>
}

export function publicImageUrl(path: string) {
  assertConfiguration()
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${supabaseUrl}/storage/v1/object/public/site-public/${encodedPath}`
}

function orderedImages<T extends PublicImage>(images: T[]) {
  return [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
}

export async function getCollectionItems(): Promise<CollectionItem[]> {
  const [items, images] = await Promise.all([
    readPublicTable<Omit<CollectionItem, 'images'>>('site_collection_items', {
      select: 'id,slug,title,description,materials,dimensions,condition_description,availability,is_featured,featured_order,sort_order,seo_title,seo_description,published_at',
      publication_status: 'eq.pubblicato',
      order: 'sort_order.asc,published_at.desc'
    }),
    readPublicTable<PublicImage & { collection_item_id: string }>('site_collection_images', {
      select: 'id,collection_item_id,storage_path,alt_text,caption,width,height,is_cover,sort_order',
      storage_bucket: 'eq.site-public',
      order: 'sort_order.asc,created_at.asc'
    })
  ])
  return items.map((item) => ({
    ...item,
    images: orderedImages(images.filter((image) => image.collection_item_id === item.id))
  }))
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  const [projects, images] = await Promise.all([
    readPublicTable<Omit<PortfolioProject, 'images'>>('site_portfolio_projects', {
      select: 'id,slug,title,summary,description,category,is_featured,featured_order,sort_order,seo_title,seo_description,published_at',
      publication_status: 'eq.pubblicato',
      order: 'sort_order.asc,published_at.desc'
    }),
    readPublicTable<PortfolioImage & { portfolio_project_id: string }>('site_portfolio_images', {
      select: 'id,portfolio_project_id,image_kind,storage_path,alt_text,caption,width,height,is_cover,sort_order',
      storage_bucket: 'eq.site-public',
      order: 'sort_order.asc,created_at.asc'
    })
  ])
  return projects.map((project) => ({
    ...project,
    images: orderedImages(images.filter((image) => image.portfolio_project_id === project.id))
  }))
}

export function featuredFirst<T extends { is_featured: boolean; featured_order: number | null; sort_order: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    return (a.featured_order ?? Number.MAX_SAFE_INTEGER) - (b.featured_order ?? Number.MAX_SAFE_INTEGER) || a.sort_order - b.sort_order
  })
}

export const availabilityLabels: Record<CollectionItem['availability'], string> = {
  disponibile: 'Disponibile',
  riservato: 'Riservato',
  non_disponibile: 'Non disponibile'
}
