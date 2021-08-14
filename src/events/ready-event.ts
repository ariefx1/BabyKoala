import BaseEvent from './base-event';

export default class ReadyEvent implements BaseEvent {
  public readonly name: string = 'ready';
  
  public async handle(): Promise<void> {
    console.log('BabyKoala is ready!');
  }
}
