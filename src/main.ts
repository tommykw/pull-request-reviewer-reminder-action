import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    core.info(`pr num: ${pullRequests.length}`)

    core.info(`pr info: ${JSON.stringify(pullRequests)}`)

    const reviewCommentUrls = pullRequests.map(pr => {
      pr.review_comments_url
    })

    const commentUrls = pullRequests.map(pr => {
      pr.comments_url
    })

    const createdList = pullRequests.map(pr => {
      pr.created_at
    })

    const titles = pullRequests.map(pr => {
      pr.title
    })

    const bodies = pullRequests.map(pr => {
      pr.body
    })

    const prIds = pullRequests.map(pr => {
      pr.id
    })

    const states = pullRequests.map(pr => {
      pr.state
    })

    core.info(`pr comment review : ${reviewCommentUrls}`)
    core.info(`pr comment : ${commentUrls}`)
    core.info(`pr created : ${createdList}`)
    core.info(`pr title : ${titles}`)
    core.info(`pr bodies : ${bodies}`)
    core.info(`pr ids : ${prIds}`)
    core.info(`pr states : ${states}`)
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

run()
