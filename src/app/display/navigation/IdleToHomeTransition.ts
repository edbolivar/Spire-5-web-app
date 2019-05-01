import { Transition } from './Transition';

export class IdleToHomeTransition implements Transition {
  type: string;

  constructor() {
    this.type = 'IdleToHome';
  }
}
