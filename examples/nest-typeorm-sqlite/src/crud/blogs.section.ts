import { Blog } from '../blog.entity'

export function blogsSection() {
  return {
    model: Blog,
    title: 'Blog',
    description: 'Blogs with unique slug enforced by config',
    list: {
      filtersWhitelist: ['title','slug','createdAt'],
      sortingWhitelist: ['createdAt','title']
    },
    create: { fieldsForUniquenessValidation: ['slug'] },
    update: { fieldsForUniquenessValidation: ['slug'] }
  }
}


