import { User } from '../user.entity'

export function usersSection() {
  return {
    model: User,
    list: {
      filtersWhitelist: ['name','email','createdAt'],
      sortingWhitelist: ['name','createdAt'],
      keyword: { isEnabled: true, searchableFields: ['name','email'] },
      pagination: { isPaginationEnabled: true, isDisableAllowed: true, maxPerPage: 100 }
    },
    details: {},
    create: {},
    update: {},
    delete: {}
  }
}
