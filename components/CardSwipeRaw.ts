type CardSwipeOptions = {
  enabled?: boolean;
  interdigitTimeout?: number;
  onScan?: (data: string[]) => void;
  debug?: boolean;
};

enum State {
  IDLE,
  PENDING1,
  PENDING2,
  READING,
  DISCARD,
  PREFIX
}

class CardSwipeRaw {
  private state: State = State.IDLE;
  private scanBuffer: string[] = [];
  private timerHandle: number | null = null;
  private settings: Required<CardSwipeOptions>;

  constructor(options: CardSwipeOptions = {}) {
    this.settings = {
      enabled: true,
      interdigitTimeout: 250,
      onScan: (data: string[]) => { },
      debug: false,
      ...options
    };

    if (this.settings.enabled) {
      this.enable();
    }
  }

  private log(msg: string) {
    if (this.settings.debug) {
      console.log(msg);
    }
  }

  private setState(newState: State) {
    this.log(`State: ${State[this.state]} -> ${State[newState]}`);
    this.state = newState;
  }

  private startTimer() {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
    }
    this.timerHandle = window.setTimeout(() => this.onTimeout(), this.settings.interdigitTimeout);
  }

  private clearTimer() {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private onTimeout() {
    this.log('Timeout!');
    if (this.state === State.READING) {
      this.processScan();
    }
    this.scanBuffer = [];
    this.setState(State.IDLE);
  }

  private processScan() {
    this.log(`Scan complete: ${this.scanBuffer.join('')}`);
    if (this.settings.onScan) {
      // Provide a copy of the buffer to the callback
      this.settings.onScan([...this.scanBuffer]);
    }
    this.scanBuffer = [];
  }

  private processCode(code: number) {
    this.scanBuffer.push(String.fromCharCode(code));
  }

  private listener = (e: KeyboardEvent) => {
    // Only handle printable characters
    if (typeof e.which !== 'number' || e.which === 0) return;

    switch (this.state) {
      case State.IDLE:
        if (e.which === 37) { // '%'
          this.setState(State.PENDING1);
          this.scanBuffer = [];
          this.processCode(e.which);
          e.preventDefault();
          e.stopPropagation();
          this.startTimer();
        } else if (e.which === 59) { // ';'
          this.setState(State.PENDING2);
          this.scanBuffer = [];
          this.processCode(e.which);
          e.preventDefault();
          e.stopPropagation();
          this.startTimer();
        }
        break;

      case State.PENDING1:
        if ((e.which >= 65 && e.which <= 90) || (e.which >= 97 && e.which <= 122)) {
          this.setState(State.READING);
          const el = document.activeElement as HTMLElement;
          if (el) el.blur();
          this.processCode(e.which);
          e.preventDefault();
          e.stopPropagation();
          this.startTimer();
        } else {
          this.clearTimer();
          this.scanBuffer = [];
          this.setState(State.IDLE);
        }
        break;

      case State.PENDING2:
        if (e.which >= 48 && e.which <= 57) {
          this.setState(State.READING);
          const el = document.activeElement as HTMLElement;
          if (el) el.blur();
          this.processCode(e.which);
          e.preventDefault();
          e.stopPropagation();
          this.startTimer();
        } else {
          this.clearTimer();
          this.scanBuffer = [];
          this.setState(State.IDLE);
        }
        break;

      case State.READING:
        this.processCode(e.which);
        this.startTimer();
        e.preventDefault();
        e.stopPropagation();
        if (e.which === 13) { // Enter
          this.clearTimer();
          this.setState(State.IDLE);
          this.processScan();
        }
        break;

      case State.DISCARD:
        e.preventDefault();
        e.stopPropagation();
        if (e.which === 13) {
          this.clearTimer();
          this.setState(State.IDLE);
        } else {
          this.startTimer();
        }
        break;

      default:
        break;
    }
  };

  public enable() {
    document.addEventListener('keypress', this.listener);
  }

  public disable() {
    document.removeEventListener('keypress', this.listener);
  }
}

export default CardSwipeRaw;
