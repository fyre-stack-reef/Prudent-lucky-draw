interface SlotConfigurations {
  maxReelItems?: number;
  removeWinner?: boolean;
  reelContainerSelector: string;
  onSpinStart?: () => void;
  onSpinEnd?: () => void;
  onNameListChanged?: () => void;
}

export default class Slot {
  private nameList: string[];
  private havePreviousWinner: boolean;
  private reelContainer: HTMLElement | null;
  private maxReelItems: NonNullable<SlotConfigurations['maxReelItems']>;
  private shouldRemoveWinner: NonNullable<SlotConfigurations['removeWinner']>;
  private reelAnimation?: Animation;
  private onSpinStart?: NonNullable<SlotConfigurations['onSpinStart']>;
  private onSpinEnd?: NonNullable<SlotConfigurations['onSpinEnd']>;
  private onNameListChanged?: NonNullable<SlotConfigurations['onNameListChanged']>;

  constructor({
    maxReelItems = 60,
    removeWinner = true,
    reelContainerSelector,
    onSpinStart,
    onSpinEnd,
    onNameListChanged
  }: SlotConfigurations) {
    this.nameList = [];
    this.havePreviousWinner = false;
    this.reelContainer = document.querySelector(reelContainerSelector);
    this.maxReelItems = maxReelItems;
    this.shouldRemoveWinner = removeWinner;
    this.onSpinStart = onSpinStart;
    this.onSpinEnd = onSpinEnd;
    this.onNameListChanged = onNameListChanged;

    this.reelAnimation = this.reelContainer?.animate(
      [
        {
          transform: 'translateY(0)',
          filter: 'blur(0)'
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * 120}px)`,
          filter: 'blur(2px)',
          offset: 0.15
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * 120}px)`,
          filter: 'blur(1.5px)',
          offset: 0.85
        },
        {
          transform: `translateY(-${(this.maxReelItems - 1) * 120}px)`,
          filter: 'blur(0)'
        }
      ],
      {
        duration: 20000,
        easing: 'ease-out',
        iterations: 1,
        fill: 'forwards'
      }
    );

    this.reelAnimation?.cancel();
  }

  set names(names: string[]) {
    this.nameList = names;

    const reelItemsToRemove = this.reelContainer?.children
      ? Array.from(this.reelContainer.children)
      : [];

    reelItemsToRemove.forEach((element) => element.remove());

    this.havePreviousWinner = false;

    if (this.onNameListChanged) {
      this.onNameListChanged();
    }
  }

  get names(): string[] {
    return this.nameList;
  }

  set shouldRemoveWinnerFromNameList(removeWinner: boolean) {
    this.shouldRemoveWinner = removeWinner;
  }

  get shouldRemoveWinnerFromNameList(): boolean {
    return this.shouldRemoveWinner;
  }

  private static shuffleNames<T = unknown>(array: T[]): T[] {
    const keys = Object.keys(array) as unknown as number[];
    const result: T[] = [];

    for (
      let k = 0, n = keys.length;
      k < array.length && n > 0;
      k += 1
    ) {
      // eslint-disable-next-line no-bitwise
      const i = Math.random() * n | 0;
      const key = keys[i];

      result.push(array[key]);

      n -= 1;

      const tmp = keys[n];
      keys[n] = key;
      keys[i] = tmp;
    }

    return result;
  }

  public async spin(durationInSeconds = 20): Promise<boolean> {
    if (!this.nameList.length) {
      console.error('Name List is empty. Cannot start spinning.');
      return false;
    }

    if (this.onSpinStart) {
      this.onSpinStart();
    }

    const { reelContainer, reelAnimation, shouldRemoveWinner } = this;

    if (!reelContainer || !reelAnimation) {
      return false;
    }

    /*
     * IMPORTANT:
     * Set the animation duration BEFORE playing it.
     */
    reelAnimation.cancel();

    reelAnimation.effect?.updateTiming({
      duration: durationInSeconds * 1000,
      easing: 'ease-out'
    });

    let randomNames = Slot.shuffleNames<string>(this.nameList);

    while (randomNames.length < this.maxReelItems) {
      randomNames = [...randomNames, ...randomNames];
    }

    randomNames = randomNames.slice(
      0,
      this.maxReelItems - Number(this.havePreviousWinner)
    );

    const fragment = document.createDocumentFragment();

    randomNames.forEach((name) => {
      const newReelItem = document.createElement('div');

      newReelItem.innerHTML = name;

      fragment.appendChild(newReelItem);
    });

    reelContainer.appendChild(fragment);

    console.info('Displayed items:', randomNames);
    console.info(
      'Winner:',
      randomNames[randomNames.length - 1]
    );

    if (shouldRemoveWinner) {
      this.nameList.splice(
        this.nameList.findIndex(
          (name) => name === randomNames[randomNames.length - 1]
        ),
        1
      );
    }

    console.info('Remaining:', this.nameList);

    const animationPromise = new Promise<void>((resolve) => {
      reelAnimation.onfinish = () => {
        resolve();
      };
    });

    /*
     * Start the reel.
     */
    reelAnimation.play();

    await animationPromise;

    reelAnimation.finish();

    Array.from(reelContainer.children)
      .slice(0, reelContainer.children.length - 1)
      .forEach((element) => element.remove());

    this.havePreviousWinner = true;

    if (this.onSpinEnd) {
      this.onSpinEnd();
    }

    return true;
  }
}
