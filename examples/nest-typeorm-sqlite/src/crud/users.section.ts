import { User } from '../user.entity'

export function usersSection() {
  return {
    model: User,
    title: 'User',
    description: 'CRUD options for User',
    list: {
      filtersWhitelist: ['name','email','createdAt'],
      sortingWhitelist: ['name','createdAt'],
      keyword: { isEnabled: true, searchableFields: ['name','email'] },
      pagination: { isPaginationEnabled: true, isDisableAllowed: true, maxPerPage: 100 }
    },
    details: {},
    // Enforce uniqueness on email and phone (OR semantics by default)
    create: { fieldsForUniquenessValidation: ['email','phone'] },
    update: { fieldsForUniquenessValidation: ['email','phone'] },
    delete: {}
  }
}
