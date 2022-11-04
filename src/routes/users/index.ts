import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { v4 as uuidv4 } from 'uuid';
import { User, UserType } from '../../../schemas/User';

const users: FastifyPluginAsync = async (fastify): Promise<void> => {
  /**
   * POST /users
   */
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Body: UserType;
  }>(
    '/',
    {
      schema: {
        body: User,
      },
    },
    async (request, response) => {
      try {
        const res = await fastify.usersDb.find({
          selector: {
            email: request.body.email,
          },
        });
        if (res.docs.length > 0) {
          response.status(409).send({
            errorCode: 40,
            success: false,
          });
        } else {
          const newUser = {
            _id: uuidv4(),
            name: request.body.name,
            email: request.body.email,
            password: request.body.password,
          };
          const res = await fastify.usersDb.put(newUser);
          if (res.ok) {
            response.status(201).send({
              success: true,
              user: newUser,
            });
          } else {
            response.status(500).send({
              errorCode: 50,
              success: false,
            });
          }
        }
      } catch (error) {
        response.status(422).send({
          errorCode: 60,
          success: false,
        });
      }
    },
  );
};

export default users;
