import { Transition } from './Transition';

export class IdleTransition implements Transition {
  type: string;

  constructor() {
    this.type = 'Idle';
  }
}
