import URI from "urijs"

// /records endpoint
window.path = "http://localhost:3000/records"
const limit = 10

const getPagination = (page) => {
  let offset = page > 1
    ? (limit * page) - limit // pages start at 1
    : 0
  return [
    ["limit", limit + 1], // get page size plus first node of next page
    ["offset", offset]
  ]
}

const isSubtractivePrimary = (color) => {
  const primaries = ['red', 'blue', 'yellow']
  return primaries.includes(color)
}

const hasNextPage = (data) => data.length > 10

const collectIDs = (curPage) => curPage.map(node => node.id)

const collectOpen = (curPage) => curPage
  .filter(node => node.disposition === 'open')
  .map(node => {
    node.isPrimary = isSubtractivePrimary(node.color)
    return node
  })

const countClosedPrimaries = (curPage) => curPage
  .filter(node => node.disposition === 'closed')
  .filter(node => isSubtractivePrimary(node.color))
  .reduce((acc, cur) => acc + 1, 0)

const retrieve = async ({page = 1, colors = []} = {}) => {
  // If called with no param obj set up defalts
  if (!page) {
   page = 1
  }
  if (!colors) {
    colors = []
  }

  // processes options into query params
  let pagination = getPagination(page)
  let filter = colors.map(color => [['color[]'], color])
  let params = new URLSearchParams([
    ...pagination,
    ...filter
  ])

  // construct URI
  let uri = URI(window.path)
    .query(params.toString())
  let url = uri.toString()

  // try fetching data
  let data
  try {
    let response = await fetch(url)
    data = await response.json()
  } catch (e) {
    // test suite expects a log on err
    console.log(e)
    return {
      error: true,
      message: e
    }
  }

  // Pull the page of data from the response
  let curPage = data.slice(0, 10)
  // construct shape
  const ids = collectIDs(curPage)
  const open = collectOpen(curPage)
  const closedPrimaryCount = countClosedPrimaries(curPage)
  const previousPage = page === 1
    ? null
    : page - 1
  const nextPage = hasNextPage(data)
    ? page + 1
    : null

  return {
    ids,
    open,
    closedPrimaryCount,
    previousPage,
    nextPage
  }
}

export default retrieve