/**
 * Basic Chat API Route with Table Annotation Example
 *
 * This is a simple example demonstrating:
 * - Text streaming with token-by-token delivery
 * - Basic markdown content with code blocks
 * - Custom annotations (table) sent after text completion
 * - Standard annotations (sources) sent after text completion
 *
 * Use this example as a starting point for implementing basic chat functionality
 * with \@llamaindex/chat-ui components.
 * 
 * modified by JISU
 */
import { NextResponse, type NextRequest } from 'next/server'

const TOKEN_DELAY = 30 // 30ms delay between tokens
const TEXT_PREFIX = '0:' // vercel ai text prefix
const ANNOTATION_PREFIX = '8:' // vercel ai annotation prefix

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    const lastMessage = messages[messages.length - 1]

    const stream = fakeChatStream(`User query: "${lastMessage.content}".\n`)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const detail = (error as Error).message
    return NextResponse.json({ detail }, { status: 500 })
  }
}

const SAMPLE_TEXT = `
Welcome to the demo of @llamaindex/chat-ui. Let me show you the different types of components that can be triggered from the server.


### Table Annotation

`
const SAMPLE_ANNOTATIONS = [
  {
    type: 'table',
    data: {
      title: 'random data',
      columns: [
        {
          field: "id",
          headerName: "Customer ID",
          width: 90,
        },
        {
          field: "FirstName",
          headerName: "First Name",
          width: 200,
        },
        {
          field: "LastName",
          headerName: "Last Name",
          width: 200,
        },
        {
          field: "Email",
          headerName: "Email",
          width: 250,
        },
        {
          field: "Phone",
          headerName: "Phone Number",
          width: 160,
        },
        {
          field: "Address",
          headerName: "Address",
          width: 160,
        },
        {
          field: "City",
          headerName: "City",
          width: 160,
        },
        {
          field: "State",
          headerName: "State",
          width: 160,
        },
        {
          field: "ZipCode",
          headerName: "ZipCode",
          width: 160,
        },
        {
          field: "Country",
          headerName: "Country",
          width: 160,
        },
      ],
      rows: [
{id: 1, FirstName: "John",LastName:"Smith",Email:"john.smith@email.com",Phone:"555-0101",Address: "123 Main St",City: "Anytown",State: "CA",ZipCode: 12345,Country: "USA"},
{id: 2, FirstName: "Jane",LastName:"Doe",Email:"jane.doe@email.com",Phone:"555-0102",Address: "456 Oak Ave",City: "Otherville",State: "NY",ZipCode: 54321,Country: "USA"},
{id: 3, FirstName: "Peter",LastName:"Jones",Email:"peter.jones@email.com",Phone:"555-0103",Address: "789 Pine Ln",City: "Someplace",State: "TX",ZipCode: 67890,Country: "USA"},
{id: 4, FirstName: "Mary",LastName:"Johnson",Email:"mary.johnson@email.com",Phone:"555-0104",Address: "101 Maple Dr",City: "Anycity",State: "FL",ZipCode: 13579,Country: "USA"},
{id: 5, FirstName: "David",LastName:"Williams",Email:"david.williams@email.com",Phone:"555-0105",Address: "212 Birch Rd",City: "Newtown",State: "IL",ZipCode: 24680,Country: "USA"},
{id: 6, FirstName: "Susan",LastName:"Brown",Email:"susan.brown@email.com",Phone:"555-0106",Address: "333 Cedar Ct",City: "Oldtown",State: "OH",ZipCode: 97531,Country: "USA"},
{id: 7, FirstName: "Michael",LastName:"Davis",Email:"michael.davis@email.com",Phone:"555-0107",Address: "444 Elm St",City: "Smallville",State: "GA",ZipCode: 86420,Country: "USA"},
{id: 8, FirstName: "Karen",LastName:"Miller",Email:"karen.miller@email.com",Phone:"555-0108",Address: "555 Spruce Ave",City: "Bigcity",State: "WA",ZipCode: 19283,Country: "USA"},
{id: 9, FirstName: "Robert",LastName:"Wilson",Email:"robert.wilson@email.com",Phone:"555-0109",Address: "666 Aspen Way",City: "Largetown",State: "CO",ZipCode: 38475,Country: "USA"},
{id: 10, FirstName: "Patricia",LastName:"Moore",Email:"patricia.moore@email.com",Phone:"555-0110",Address: "777 Willow Pl",City: "Middletown",State: "MI",ZipCode: 27364,Country: "USA"},
{id: 11, FirstName: "James",LastName:"Taylor",Email:"james.taylor@email.com",Phone:"555-0111",Address: "888 Redwood Blvd",City: "Centerville",State: "VA",ZipCode: 56473,Country: "USA"},
{id: 12, FirstName: "Jennifer",LastName:"Anderson",Email:"jennifer.anderson@email.com",Phone:"555-0112",Address: "999 Sequoia Cir",City: "Northwood",State: "OR",ZipCode: 45362,Country: "USA"},
{id: 13, FirstName: "William",LastName:"Thomas",Email:"william.thomas@email.com",Phone:"555-0113",Address: "111 Juniper St",City: "Southville",State: "AZ",ZipCode: 65748,Country: "USA"},
{id: 14, FirstName: "Linda",LastName:"Jackson",Email:"linda.jackson@email.com",Phone:"555-0114",Address: "222 Poplar Ave",City: "Eastwood",State: "NM",ZipCode: 78659,Country: "USA"},
{id: 15, FirstName: "Richard",LastName:"White",Email:"richard.white@email.com",Phone:"555-0115",Address: "333 Sycamore Rd",City: "Westwood",State: "UT",ZipCode: 89567,Country: "USA"},
{id: 16, FirstName: "Barbara",LastName:"Harris",Email:"barbara.harris@email.com",Phone:"555-0116",Address: "444 Magnolia Ct",City: "Rivertown",State: "NV",ZipCode: 98765,Country: "USA"},
{id: 17, FirstName: "Joseph",LastName:"Martin",Email:"joseph.martin@email.com",Phone:"555-0117",Address: "555 Cypress Ln",City: "Laketown",State: "MT",ZipCode: 43210,Country: "USA"},
{id: 18, FirstName: "Elizabeth",LastName:"Thompson",Email:"elizabeth.thompson@email.com",Phone:"555-0118",Address: "666 Palm Dr",City: "Beachtown",State: "SC",ZipCode: 54321,Country: "USA"},
{id: 19, FirstName: "Thomas",LastName:"Garcia",Email:"thomas.garcia@email.com",Phone:"555-0119",Address: "777 Orange St",City: "Hilltop",State: "NC",ZipCode: 65432,Country: "USA"},
{id: 20, FirstName: "Jessica",LastName:"Martinez",Email:"jessica.martinez@email.com",Phone:"555-0120",Address: "888 Lemon Ave",City: "Valleydale",State: "ND",ZipCode: 76543,Country: "USA"},
{id: 21, FirstName: "John",LastName:"Smith",Email:"john.smith@email.com",Phone:"555-0101",Address: "123 Main St",City: "Anytown",State: "CA",ZipCode: 12345,Country: "USA"},
{id: 22, FirstName: "Jane",LastName:"Doe",Email:"jane.doe@email.com",Phone:"555-0102",Address: "456 Oak Ave",City: "Otherville",State: "NY",ZipCode: 54321,Country: "USA"},
{id: 23, FirstName: "Peter",LastName:"Jones",Email:"peter.jones@email.com",Phone:"555-0103",Address: "789 Pine Ln",City: "Someplace",State: "TX",ZipCode: 67890,Country: "USA"},
{id: 24, FirstName: "Mary",LastName:"Johnson",Email:"mary.johnson@email.com",Phone:"555-0104",Address: "101 Maple Dr",City: "Anycity",State: "FL",ZipCode: 13579,Country: "USA"},
{id: 25, FirstName: "David",LastName:"Williams",Email:"david.williams@email.com",Phone:"555-0105",Address: "212 Birch Rd",City: "Newtown",State: "IL",ZipCode: 24680,Country: "USA"},
{id: 26, FirstName: "Susan",LastName:"Brown",Email:"susan.brown@email.com",Phone:"555-0106",Address: "333 Cedar Ct",City: "Oldtown",State: "OH",ZipCode: 97531,Country: "USA"},
{id: 27, FirstName: "Michael",LastName:"Davis",Email:"michael.davis@email.com",Phone:"555-0107",Address: "444 Elm St",City: "Smallville",State: "GA",ZipCode: 86420,Country: "USA"},
{id: 28, FirstName: "Karen",LastName:"Miller",Email:"karen.miller@email.com",Phone:"555-0108",Address: "555 Spruce Ave",City: "Bigcity",State: "WA",ZipCode: 19283,Country: "USA"},
{id: 29, FirstName: "Robert",LastName:"Wilson",Email:"robert.wilson@email.com",Phone:"555-0109",Address: "666 Aspen Way",City: "Largetown",State: "CO",ZipCode: 38475,Country: "USA"},
{id: 30, FirstName: "Patricia",LastName:"Moore",Email:"patricia.moore@email.com",Phone:"555-0110",Address: "777 Willow Pl",City: "Middletown",State: "MI",ZipCode: 27364,Country: "USA"},
{id: 31, FirstName: "James",LastName:"Taylor",Email:"james.taylor@email.com",Phone:"555-0111",Address: "888 Redwood Blvd",City: "Centerville",State: "VA",ZipCode: 56473,Country: "USA"},
{id: 32, FirstName: "Jennifer",LastName:"Anderson",Email:"jennifer.anderson@email.com",Phone:"555-0112",Address: "999 Sequoia Cir",City: "Northwood",State: "OR",ZipCode: 45362,Country: "USA"},
{id: 33, FirstName: "William",LastName:"Thomas",Email:"william.thomas@email.com",Phone:"555-0113",Address: "111 Juniper St",City: "Southville",State: "AZ",ZipCode: 65748,Country: "USA"},
{id: 34, FirstName: "Linda",LastName:"Jackson",Email:"linda.jackson@email.com",Phone:"555-0114",Address: "222 Poplar Ave",City: "Eastwood",State: "NM",ZipCode: 78659,Country: "USA"},
{id: 35, FirstName: "Richard",LastName:"White",Email:"richard.white@email.com",Phone:"555-0115",Address: "333 Sycamore Rd",City: "Westwood",State: "UT",ZipCode: 89567,Country: "USA"},
{id: 36, FirstName: "Barbara",LastName:"Harris",Email:"barbara.harris@email.com",Phone:"555-0116",Address: "444 Magnolia Ct",City: "Rivertown",State: "NV",ZipCode: 98765,Country: "USA"},
{id: 37, FirstName: "Joseph",LastName:"Martin",Email:"joseph.martin@email.com",Phone:"555-0117",Address: "555 Cypress Ln",City: "Laketown",State: "MT",ZipCode: 43210,Country: "USA"},
{id: 38, FirstName: "Elizabeth",LastName:"Thompson",Email:"elizabeth.thompson@email.com",Phone:"555-0118",Address: "666 Palm Dr",City: "Beachtown",State: "SC",ZipCode: 54321,Country: "USA"},
{id: 39, FirstName: "Thomas",LastName:"Garcia",Email:"thomas.garcia@email.com",Phone:"555-0119",Address: "777 Orange St",City: "Hilltop",State: "NC",ZipCode: 65432,Country: "USA"},
{id: 40, FirstName: "Jessica",LastName:"Martinez",Email:"jessica.martinez@email.com",Phone:"555-0120",Address: "888 Lemon Ave",City: "Valleydale",State: "ND",ZipCode: 76543,Country: "USA"},
{id: 41, FirstName: "John",LastName:"Smith",Email:"john.smith@email.com",Phone:"555-0101",Address: "123 Main St",City: "Anytown",State: "CA",ZipCode: 12345,Country: "USA"},
{id: 42, FirstName: "Jane",LastName:"Doe",Email:"jane.doe@email.com",Phone:"555-0102",Address: "456 Oak Ave",City: "Otherville",State: "NY",ZipCode: 54321,Country: "USA"},
{id: 43, FirstName: "Peter",LastName:"Jones",Email:"peter.jones@email.com",Phone:"555-0103",Address: "789 Pine Ln",City: "Someplace",State: "TX",ZipCode: 67890,Country: "USA"},
{id: 44, FirstName: "Mary",LastName:"Johnson",Email:"mary.johnson@email.com",Phone:"555-0104",Address: "101 Maple Dr",City: "Anycity",State: "FL",ZipCode: 13579,Country: "USA"},
{id: 45, FirstName: "David",LastName:"Williams",Email:"david.williams@email.com",Phone:"555-0105",Address: "212 Birch Rd",City: "Newtown",State: "IL",ZipCode: 24680,Country: "USA"},
{id: 46, FirstName: "Susan",LastName:"Brown",Email:"susan.brown@email.com",Phone:"555-0106",Address: "333 Cedar Ct",City: "Oldtown",State: "OH",ZipCode: 97531,Country: "USA"},
{id: 47, FirstName: "Michael",LastName:"Davis",Email:"michael.davis@email.com",Phone:"555-0107",Address: "444 Elm St",City: "Smallville",State: "GA",ZipCode: 86420,Country: "USA"},
{id: 48, FirstName: "Karen",LastName:"Miller",Email:"karen.miller@email.com",Phone:"555-0108",Address: "555 Spruce Ave",City: "Bigcity",State: "WA",ZipCode: 19283,Country: "USA"},
{id: 49, FirstName: "Robert",LastName:"Wilson",Email:"robert.wilson@email.com",Phone:"555-0109",Address: "666 Aspen Way",City: "Largetown",State: "CO",ZipCode: 38475,Country: "USA"},
{id: 50, FirstName: "Patricia",LastName:"Moore",Email:"patricia.moore@email.com",Phone:"555-0110",Address: "777 Willow Pl",City: "Middletown",State: "MI",ZipCode: 27364,Country: "USA"},
{id: 51, FirstName: "James",LastName:"Taylor",Email:"james.taylor@email.com",Phone:"555-0111",Address: "888 Redwood Blvd",City: "Centerville",State: "VA",ZipCode: 56473,Country: "USA"},
{id: 52, FirstName: "Jennifer",LastName:"Anderson",Email:"jennifer.anderson@email.com",Phone:"555-0112",Address: "999 Sequoia Cir",City: "Northwood",State: "OR",ZipCode: 45362,Country: "USA"},
{id: 53, FirstName: "William",LastName:"Thomas",Email:"william.thomas@email.com",Phone:"555-0113",Address: "111 Juniper St",City: "Southville",State: "AZ",ZipCode: 65748,Country: "USA"},
{id: 54, FirstName: "Linda",LastName:"Jackson",Email:"linda.jackson@email.com",Phone:"555-0114",Address: "222 Poplar Ave",City: "Eastwood",State: "NM",ZipCode: 78659,Country: "USA"},
{id: 55, FirstName: "Richard",LastName:"White",Email:"richard.white@email.com",Phone:"555-0115",Address: "333 Sycamore Rd",City: "Westwood",State: "UT",ZipCode: 89567,Country: "USA"},
{id: 56, FirstName: "Barbara",LastName:"Harris",Email:"barbara.harris@email.com",Phone:"555-0116",Address: "444 Magnolia Ct",City: "Rivertown",State: "NV",ZipCode: 98765,Country: "USA"},
{id: 57, FirstName: "Joseph",LastName:"Martin",Email:"joseph.martin@email.com",Phone:"555-0117",Address: "555 Cypress Ln",City: "Laketown",State: "MT",ZipCode: 43210,Country: "USA"},
{id: 58, FirstName: "Elizabeth",LastName:"Thompson",Email:"elizabeth.thompson@email.com",Phone:"555-0118",Address: "666 Palm Dr",City: "Beachtown",State: "SC",ZipCode: 54321,Country: "USA"},
{id: 59, FirstName: "Thomas",LastName:"Garcia",Email:"thomas.garcia@email.com",Phone:"555-0119",Address: "777 Orange St",City: "Hilltop",State: "NC",ZipCode: 65432,Country: "USA"},
{id: 60, FirstName: "Jessica",LastName:"Martinez",Email:"jessica.martinez@email.com",Phone:"555-0120",Address: "888 Lemon Ave",City: "Valleydale",State: "ND",ZipCode: 76543,Country: "USA"},
      ]
    },
  },
  {
    type: 'sources',
    data: {
      nodes: [
        { id: '1', url: '/sample.csv' },
      ],
    },
  },
]

const fakeChatStream = (query: string): ReadableStream => {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(
        encoder.encode(`${TEXT_PREFIX}${JSON.stringify(query)}\n`)
      )

      for (const token of SAMPLE_TEXT.split(' ')) {
        await new Promise(resolve => setTimeout(resolve, TOKEN_DELAY))
        controller.enqueue(
          encoder.encode(`${TEXT_PREFIX}${JSON.stringify(`${token} `)}\n`)
        )
      }

      for (const item of SAMPLE_ANNOTATIONS) {
        controller.enqueue(
          encoder.encode(`${ANNOTATION_PREFIX}${JSON.stringify([item])}\n`)
        )
      }

      controller.close()
    },
  })
}
