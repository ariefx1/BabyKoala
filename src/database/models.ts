export class User {
  constructor(
    // HASH KEY
    public Tag: string,
    // RANGE KEY
    public Points: number,
    public Date: string,
    public LifetimePoints: number,
  ) { }
}
