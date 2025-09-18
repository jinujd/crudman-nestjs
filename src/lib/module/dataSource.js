import { CrudmanRegistry } from './CrudmanRegistry';
export function setCrudmanDataSource(dataSource) {
    CrudmanRegistry.get().setDataSource(dataSource);
}
export function getCrudmanDataSource() {
    return CrudmanRegistry.get().getDataSource();
}
