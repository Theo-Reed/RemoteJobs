// miniprogram/utils/article.ts

/**
 * Article item - represents a single item within an article
 */
export type ArticleItem = {
  id: number | string
  image?: string
  title: string
  description?: string
  /**
   * Status from database: 'active' or 'ended'
   * Used for both display text (translated) and badge styling
   */
  status?: 'active' | 'ended'
  /**
   * Rich text content for WeChat Mini Program rich-text component.
   * Can be either:
   * - Array of nodes (recommended for rich-text)
   * - HTML string (will be parsed by rich-text)
   */
  richText?: any[] | string
}

/**
 * Article - represents a collection of article items
 */
export type Article = {
  id: string
  title: string
  items: ArticleItem[]
  /**
   * Optional rich text content for the entire article.
   * If provided, this will be used instead of concatenating items.
   */
  richText?: any[] | string
}

/**
 * Convert article items to rich-text nodes format
 * This is a helper function to convert article items into the format
 * expected by WeChat Mini Program's rich-text component.
 */
export function articleItemsToRichTextNodes(items: ArticleItem[]): any[] {
  const nodes: any[] = []
  for (const item of items) {
    if (item.richText) {
      // If item has richText, use it directly
      if (Array.isArray(item.richText)) {
        nodes.push(...item.richText)
      } else {
        // If it's a string, wrap it in a div
        nodes.push({
          name: 'div',
          attrs: { style: 'margin:0 0 16px 0' },
          children: [{ type: 'text', text: item.richText }]
        })
      }
    } else {
      // Fallback: build nodes from title and description
      if (item.title) {
        nodes.push({
          name: 'h3',
          attrs: { style: 'margin:0 0 8px 0' },
          children: [{ type: 'text', text: item.title }]
        })
      }
      if (item.description) {
        nodes.push({
          name: 'div',
          attrs: { style: 'margin:0 0 16px 0;color:#374151' },
          children: [{ type: 'text', text: item.description }]
        })
      }
    }
  }
  return nodes
}

/**
 * Get rich text nodes for an article.
 * If article has richText, use it; otherwise convert items to nodes.
 */
export function getArticleRichTextNodes(article: Article): any[] {
  if (article.richText) {
    if (Array.isArray(article.richText)) {
      return article.richText
    } else {
      // If it's a string, wrap it in a div
      return [{
        name: 'div',
        attrs: { style: 'margin:0 0 16px 0' },
        children: [{ type: 'text', text: article.richText }]
      }]
    }
  }
  return articleItemsToRichTextNodes(article.items || [])
}

