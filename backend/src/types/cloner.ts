export type CloneSectionType =
  | "header"
  | "hero"
  | "content"
  | "features"
  | "testimonials"
  | "pricing"
  | "faq"
  | "footer"
  | "unknown";

export type CloneSection = {
  id: string;
  type: CloneSectionType;
  tag: string;
  heading: string | null;
  text: string;
  links: Array<{
    text: string;
    href: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
};

export type CloneProject = {
  id: string;
  sourceUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  favicon: string | null;

  headings: string[];
  texts: string[];

  links: Array<{
    text: string;
    href: string;
  }>;

  images: Array<{
    src: string;
    alt: string;
  }>;

  sections: CloneSection[];

  visualHtml: string;
  visualBodyHtml: string;
  visualHeadHtml: string;

  fetchedAt: string;
};