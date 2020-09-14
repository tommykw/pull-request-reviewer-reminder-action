import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    for (const pr of pullRequests) {
      core.info(`test ${pr.title}`)

      const prRequestedEvent = await octokit.graphql({
        query: `query prRequestedEvent($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              timelineItems(first: 20, itemTypes: [REVIEW_REQUESTED_EVENT]) {
                nodes {
                  __typename
                  ... on ReviewRequestedEvent {
                    createdAt
                  }
                }
              }
            }
          }
        }`,
        owner: github.context.repo.owner,
        name: github.context.repo.repo,
        number: pr.number
      })

      //core.info(prRequestedEvent)
      core.info(`${JSON.stringify(prRequestedEvent)}`)

      if (pr.draft) {
        continue
      }

      if (pr.requested_reviewers.length === 0) {
        continue
      }

      const currentTime = new Date().getTime()
      const pullRequestCreatedTime =
        new Date(pr.created_at).getTime() + 60 * 60 * 24

      if (currentTime > pullRequestCreatedTime) {
        continue
      }

      const {data: pullRequest} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      if (pullRequest.review_comments !== 0) {
        continue
      }

      const reviewers = pullRequest.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: `${reviewers} \nレビュー開始から1営業日経過しました。レビューをなるべく優先しましょう。`
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
