import { Money } from '../value-objects/Money'

export interface ISpecification<T> {
  isSatisfiedBy(candidate: T): boolean
  and(spec: ISpecification<T>): ISpecification<T>
  or(spec: ISpecification<T>): ISpecification<T>
  not(): ISpecification<T>
}

export abstract class AbstractSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean

  and(spec: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, spec)
  }

  or(spec: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, spec)
  }

  not(): ISpecification<T> {
    return new NotSpecification(this)
  }
}

export class AndSpecification<T> extends AbstractSpecification<T> {
  constructor(
    private left: ISpecification<T>,
    private right: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
  }
}

export class OrSpecification<T> extends AbstractSpecification<T> {
  constructor(
    private left: ISpecification<T>,
    private right: ISpecification<T>
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
  }
}

export class NotSpecification<T> extends AbstractSpecification<T> {
  constructor(private spec: ISpecification<T>) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }
}