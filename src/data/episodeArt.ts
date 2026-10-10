import type { CastMember, NovelScript } from '../types/novel';
import { SCENES } from '../features/picturebook/scenes';
import { KANA_CAST, KANA_SCRIPTS } from './scripts/kana';
import { MOJI1_PRELUDE } from './scripts/moji1';
import { MOJI_CAST, MOJI_SCRIPTS } from './mojiScripts';
import { getMojiEpisode } from './mojiEpisodes';
import { getMojiFinale } from './mojiFinale';
import { MOJI_FINALE_SCRIPTS } from './mojiFinaleScripts';

/** The battle screen's frame (features/battle/NaniwaBattleView.tsx); its sky is the episode's own scene. Nexmax at クラス ★4 in his class-up picture (docs/design/21). */
const battleUi = (star4: boolean) => ['frame_top', 'frame_bottom', star4 ? 'nexmax_brush_star4' : 'nexmax_brush', 'btn_back'].map((n) => `img/battle/${n}.webp`);

/** Every painted scene and portrait a script shows. */
const scriptArt = (scripts: NovelScript[], cast: CastMember[]): string[] => {
  const byId = new Map(cast.map((c) => [c.id, c]));
  const out: string[] = [];
  for (const s of scripts) {
    for (const l of s.lines) {
      const photo = l.bg ? SCENES[l.bg]?.photo : undefined;
      if (photo) out.push(photo);
      const [id, expr] = (l.sprite && l.sprite !== 'none' ? l.sprite : l.speaker ? `${l.speaker}:normal` : '').split(':');
      const member = id ? byId.get(id) : undefined;
      const sprite = member ? (member.sprites[expr ?? 'normal'] ?? member.sprites.normal) : undefined;
      if (sprite) out.push(sprite);
    }
  }
  return out;
};

/**
 * The pictures an episode will need — fetched from the stage select while the
 * player is still choosing, so the story opens on a finished picture instead
 * of one that pops in a moment later on a slow line.
 */
export const episodeArt = (id: string, { star4 = false }: { star4?: boolean } = {}): string[] => {
  const battle = battleUi(star4);
  const kana = KANA_SCRIPTS[id];
  if (kana) return [...new Set(scriptArt([kana.intro, kana.outro], KANA_CAST))];
  const finale = getMojiFinale(id);
  if (finale) {
    const story = MOJI_FINALE_SCRIPTS[id];
    const scene = SCENES[finale.bg]?.photo;
    return [
      ...new Set([
        ...(story ? scriptArt([story.intro, story.outro], [...MOJI_CAST]) : []),
        ...(scene ? [scene] : []),
        ...(finale.boss.img ? [finale.boss.img] : []),
        ...battle,
      ]),
    ];
  }
  const moji = MOJI_SCRIPTS[id];
  if (!moji) return [];
  const ep = getMojiEpisode(id);
  const scripts = [moji.intro, moji.encounter, moji.outro, ...(id === MOJI1_PRELUDE.stageId ? [MOJI1_PRELUDE] : [])];
  return [...new Set([...scriptArt(scripts, [...MOJI_CAST]), ...(ep?.boss.img ? [ep.boss.img] : []), ...battle])];
};
