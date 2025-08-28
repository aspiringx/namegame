interface RelatedApplication {
  platform: string;
  url: string;
  id?: string;
}

interface Navigator {
  getInstalledRelatedApps?(): Promise<RelatedApplication[]>;
}
