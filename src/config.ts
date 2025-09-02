import dotenv from "dotenv";

const envName = process.env.NODE_ENV === "production" ? "production" : "local";

dotenv.config({
  path: `./.env.${envName}`,
});

class BotConfig {
  private _clientId?: string;
  private _truthSources = new Map<string, Set<string>>();
  public readonly BSID = "697374082509045800"; // A special user ID which should be globally ignored (DO NOT REMOVE OR CHANGE!)
  constructor(
    public guildIds: string[],
    public dbUrl: string,
    public readonly botToken: string,
    public readonly dbUser: string,
    public readonly NODE_ENV: string,
    public readonly dbPassword?: string,
    public readonly dbName?: string,
  ) {
    if (this.guildIds.length === 0) {
      throw new Error("No guild IDs provided");
    }
  }

  get clientId() {
    return this._clientId;
  }

  setClientId(clientId: string) {
    this._clientId = clientId;
  }

  get truthSources() {
    return this._truthSources;
  }

  addTruthSource(guildId: string, source: string) {
    const _sources = this._truthSources.get(guildId) || new Set<string>();
    _sources.add(source);
    this._truthSources.set(guildId, _sources);
  }

  removeTruthSource(guildId: string, source: string) {
    const _sources = this._truthSources.get(guildId);
    _sources?.delete(source);
    if (_sources) this._truthSources.set(guildId, _sources);
  }

  isTruthSourceFor(guildId: string, userId: string) {
    return userId !== this.BSID && !!this._truthSources.get(guildId)?.has(userId);
  }
}

const botConfig = new BotConfig(
  process.env.GUILDS?.split(",").map((id) => id.trim()) || [],
  process.env.DATABASE_URL || "",
  process.env.BOT_TOKEN || "",
  process.env.POSTGRES_USER || "crossban",
  process.env.NODE_ENV || "development",
  process.env.POSTGRES_PASSWORD,
  process.env.POSTGRES_DB,
);

export { botConfig as config };
