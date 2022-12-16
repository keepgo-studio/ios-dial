class Cache {
  static async cache(mp3Src: string) {
    return await fetch(mp3Src)
      .then((v) => v.blob())
      .catch(() => undefined);
  }
}

export default Cache;
