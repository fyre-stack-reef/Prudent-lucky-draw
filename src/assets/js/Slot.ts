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
    const result: T[] = [...array];

    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  public async spin(durationInSeconds = 20): Promise<boolean> {
    if (!this.nameList.length || !this.reelContainer) {
      return false;
    }

    if (this.onSpinStart) {
      this.onSpinStart();
    }

    const reelContainer = this.reelContainer;

    let randomNames = Slot.shuffleNames(this.nameList);

    while (randomNames.length < this.maxReelItems) {
      randomNames = [...randomNames, ...randomNames];
    }

    randomNames = randomNames.slice(
      0,
      this.maxReelItems - Number(this.havePreviousWinner)
    );

    const fragment = document.createDocumentFragment();

    randomNames.forEach((name) => {
      const item = document.createElement('div');
      item.textContent = name;
      fragment.appendChild(item);
    });

    reelContainer.appendChild(fragment);

    const item = reelContainer.children[0] as HTMLElement;

    const itemHeight = item
      ? item.getBoundingClientRect().height
      : 120;

    const distance = (randomNames.length - 1) * itemHeight;

    const winner = randomNames[randomNames.length - 1];

    if (this.shouldRemoveWinner) {
      const winnerIndex = this.nameList.indexOf(winner);

      if (winnerIndex !== -1) {
        this.nameList.splice(winnerIndex, 1);
      }
    }

    /*
     * Use the Web Animations API directly.
     *
     * The animation ALWAYS lasts the selected duration.
     * Linear timing prevents the reel from racing to the
     * end during the first second.
     */
    const animation = reelContainer.animate(
      [
        {
          transform: 'translateY(0)',
          filter: 'blur(0)'
        },
        {
          transform: `translateY(-${distance * 0.85}px)`,
          filter: 'blur(2px)'
        },
        {
          transform: `translateY(-${distance}px)`,
          filter: 'blur(0)'
        }
      ],
      {
        duration: durationInSeconds * 1000,
        easing: 'linear',
        fill: 'forwards'
      }
    );

    await animation.finished;

    animation.cancel();

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
