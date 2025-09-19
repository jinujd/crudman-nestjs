type AnyDecorator = (...args: any[]) => any

function noOp(): AnyDecorator { return () => () => {} }

function getSwagger(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@nestjs/swagger')
  } catch {
    return null
  }
}

const swagger = getSwagger()

export const ApiOperation: AnyDecorator = swagger?.ApiOperation || noOp()
export const ApiParam: AnyDecorator = swagger?.ApiParam || noOp()
export const ApiBody: AnyDecorator = swagger?.ApiBody || noOp()
export const ApiOkResponse: AnyDecorator = swagger?.ApiOkResponse || noOp()
export const ApiTags: AnyDecorator = swagger?.ApiTags || noOp()
export const ApiQuery: AnyDecorator = swagger?.ApiQuery || noOp()



