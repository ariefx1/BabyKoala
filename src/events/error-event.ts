import BaseEvent from './base-event';

export default class ErrorEvent implements BaseEvent {
  public readonly name: string = 'error';
  
  public async handle(err: Error): Promise<void> {
    console.log(`Error: ${err}`);
  }
}
