class Cache {
  static async cache(mp3Src: string) {
    return await fetch(mp3Src)
      .then((v) => v.blob())
      .catch((err) => console.error('Cache:', err));
  }
}

export default Cache;
