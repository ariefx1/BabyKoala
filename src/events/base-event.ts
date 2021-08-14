export default interface BaseEvent {
  readonly name: string;

  handle(...args: any): Promise<void>;
}
