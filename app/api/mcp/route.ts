import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Sample data - replace with actual data fetching
async function getEntries(category?: string) {
  return [
    {
      slug: 'sample-entry',
      title: 'Sample Entry',
      content: 'This is a sample entry.',
      category: category || 'general',
      date: new Date().toISOString()
    }
  ];
}

async function getEntryBySlug(slug: string) {
  return {
    slug,
    title: 'Sample Entry',
    content: 'This is a sample entry.',
    date: new Date().toISOString()
  };
}

async function searchEntries(query: string) {
  return [
    {
      slug: 'sample-entry',
      title: 'Sample Entry',
      content: 'This is a sample entry.',
      relevance: 0.95
    }
  ];
}

async function getCategories() {
  return ['general', 'tutorial', 'reference'];
}

export async function POST(request: NextRequest) {
  let requestId: number | string = 0;

  try {
    const body: MCPRequest = await request.json();
    requestId = body.id;
    const { method, params, id } = body;

    let result: any = {};

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'MCP Server',
            version: '1.0.0'
          }
        };
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'get_entries',
              description: 'Get all entries',
              inputSchema: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    description: 'Filter by category'
                  }
                }
              }
            },
            {
              name: 'get_entry_by_slug',
              description: 'Get entry by slug',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: {
                    type: 'string',
                    description: 'Entry slug'
                  }
                },
                required: ['slug']
              }
            },
            {
              name: 'search_entries',
              description: 'Search entries',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query'
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'get_categories',
              description: 'Get all categories',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };
        break;

      case 'tools/call':
        const toolName = params?.name;
        const toolArgs = params?.arguments;

        switch (toolName) {
          case 'get_entries':
            result = await getEntries(toolArgs?.category);
            break;
          case 'get_entry_by_slug':
            result = await getEntryBySlug(toolArgs?.slug);
            break;
          case 'search_entries':
            result = await searchEntries(toolArgs?.query);
            break;
          case 'get_categories':
            result = await getCategories();
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
      result
    };

    return Response.json(response);

  } catch (error) {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
        data: error instanceof Error ? error.stack : undefined
      }
    };

    return Response.json(response, { status: 500 });
  }
}
