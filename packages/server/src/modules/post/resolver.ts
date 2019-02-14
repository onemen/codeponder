import { ApolloError } from "apollo-server-core";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Post } from "../../entity/Post";
import { PostRepository } from "../../repositories/PostRepo";
import { QuestionRepository } from "../../repositories/QuestionRepo";
import { MyContext } from "../../types/Context";
import { isAuthenticated } from "../shared/middleware/isAuthenticated";
import { CreatePostInput } from "./createInput";
import { FindPostInput } from "./findInput";
import { FindPostResponse } from "./findResponse";
import { PostResponse } from "./response";

@Resolver(Post)
export class PostResolvers {
  constructor(
    @InjectRepository(QuestionRepository)
    private readonly questionRepo: QuestionRepository,
    @InjectRepository(PostRepository)
    private readonly postRepo: PostRepository
  ) {}

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuthenticated)
  async findOrCreatePost(
    @Arg("post") input: CreatePostInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    let value = await this.postRepo.findOne({
      where: {
        commitId: input.commitId,
        repo: input.repo,
        repoOwner: input.repoOwner,
      },
    });

    if (!value) {
      value = await this.postRepo.save({
        ...input,
        creatorId: req.session!.userId,
      });
    }

    return {
      post: value,
    };
  }

  @Query(() => Post, {
    nullable: true,
  })
  async getPostById(@Arg("id") id: string) {
    return this.postRepo.findOne(id);
  }

  @FieldResolver()
  numQuestions(@Root() root: Post) {
    return this.questionRepo.count({ where: { postId: root.id } });
  }

  @Query(() => FindPostResponse)
  async findPost(@Arg("input")
  {
    offset,
    limit,
    topics,
  }: FindPostInput): Promise<FindPostResponse> {
    if (limit > 6) {
      throw new ApolloError("max limit of 6");
    }

    return this.postRepo.findByTopics({
      limit,
      offset,
      topics,
    });
  }
}
