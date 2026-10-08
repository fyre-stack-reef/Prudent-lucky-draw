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

    const { reelContainer, shouldRemoveWinner } = this;

    if (!reelContainer) {
      return false;
    }

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

    const firstItem = reelContainer.children[0] as HTMLElement;

    const itemHeight = firstItem
      ? firstItem.getBoundingClientRect().height
      : 120;

    const distance =
      (randomNames.length - 1) * itemHeight;

    console.info('Item height:', itemHeight);
    console.info('Reel distance:', distance);
    console.info('Draw duration:', durationInSeconds);

    const winner = randomNames[randomNames.length - 1];

    console.info('Winner:', winner);

    if (shouldRemoveWinner) {
      const winnerIndex = this.nameList.findIndex(
        (name) => name === winner
      );

      if (winnerIndex !== -1) {
        this.nameList.splice(winnerIndex, 1);
      }
    }

    /*
     * The reel animation deliberately uses the FULL
     * selected duration.
     *
     * Linear movement keeps the reel visibly spinning
     * instead of racing to the end immediately.
     *
     * The final 10% slows down so the winner feels
     * like a proper game-show reveal.
     */
    const reelAnimation = reelContainer.animate(
      [
        {
          transform: 'translateY(0)',
          filter: 'blur(0)'
        },
        {
          transform: `translateY(-${distance * 0.75}px)`,
          filter: 'blur(2px)',
          offset: 0.75
        },
        {
          transform: `translateY(-${distance * 0.92}px)`,
          filter: 'blur(1.5px)',
          offset: 0.90
        },
        {
          transform: `translateY(-${distance}px)`,
          filter: 'blur(0)',
          offset: 1
        }
      ],
      {
        duration: Math.max(1000, durationInSeconds * 1000),
        easing: 'linear',
        iterations: 1,
        fill: 'forwards'
      }
    );

    await reelAnimation.finished;

    reelAnimation.commitStyles();
    reelAnimation.cancel();

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
