/**
 * The novel script format.
 *
 * A stage's story is a flat list of lines. Branches are expressed by choices
 * that jump to a label, not by nesting, so a whole scene can be read top to
 * bottom in the source — which matters because the people editing these are
 * writing Japanese for learners, not maintaining a tree.
 */

/** Who is speaking. `null` is narration (地の文). */
export type SpeakerId = string | null;

export interface NovelChoice {
  /** Button text, in furigana notation. */
  label: string;
  /** Label to jump to. */
  next: string;
}

export interface NovelLine {
  /** Optional jump target for choices. */
  label?: string;
  speaker?: SpeakerId;
  /** The line itself, in furigana notation: "高(たか)い 木(き)". */
  text: string;
  /**
   * Scene id (a picture-book scene, see features/picturebook/scenes.ts);
   * carries over from the previous line when omitted.
   */
  bg?: string;
  /**
   * Picture-book effects for this line — "boar", "rain", "portal"…
   * Carries over like `bg`, and is cleared when the scene changes.
   * `[]` clears it explicitly.
   */
  fx?: string[];
  /**
   * A character shown large over the scene, in furigana notation — the
   * letter Nexmax carves, the kanji just obtained.
   */
  glyph?: string;
  /** Sprite id, e.g. "nexmax:think". Use "none" to clear. */
  sprite?: string;
  /**
   * Choices shown instead of the advance button. These flavour the story;
   * they are never right or wrong. Learning is judged in the drill, not here.
   */
  choices?: NovelChoice[];
  /** Jump unconditionally after this line (used to skip past other branches). */
  goto?: string;
  /**
   * English for a reader who cannot read the line yet (かな編). Shown only
   * when the EN button is pressed — the line itself stays Japanese.
   */
  en?: string;
}

export interface NovelScript {
  stageId: string;
  lines: NovelLine[];
}

/** A character who can appear in a scene. */
export interface CastMember {
  id: string;
  /** Display name in furigana notation. */
  name: string;
  /** Sprite variants, keyed by expression. Values are asset paths. */
  sprites: Record<string, string>;
  /** Name-plate tint. */
  color?: string;
  /**
   * Drawn as a dark shape with no face — 現代編's 影の先輩, frightening but
   * never a named, visible person.
   */
  silhouette?: boolean;
}
